package com.applicationtracker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ApplicationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Order(1)
    void healthEndpointIsAvailable() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @Order(2)
    void applicationCrudPaginationAndStatsFlow() throws Exception {
        String email = "prodtest@applicationtracker.com";
        String accessToken = registerAndLogin(email);

        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "companyName": "Acme Corp",
                                  "appliedDate": "2026-07-04",
                                  "companyLink": "https://acme.example.com",
                                  "contactFollowUp": "hr@acme.example.com",
                                  "status": "UNDER_CONSIDERATION",
                                  "notes": "Applied via careers page"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.status").value("UNDER_CONSIDERATION"));

        MvcResult listResult = mockMvc.perform(get("/api/applications")
                        .header("Authorization", "Bearer " + accessToken)
                        .param("page", "0")
                        .param("size", "10")
                        .param("appliedDate", "2026-07-04"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andReturn();

        JsonNode listBody = objectMapper.readTree(listResult.getResponse().getContentAsString());
        String applicationId = listBody.get("content").get(0).get("id").asText();

        mockMvc.perform(put("/api/applications/" + applicationId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "companyName": "Acme Corp",
                                  "appliedDate": "2026-07-04",
                                  "companyLink": "https://acme.example.com",
                                  "contactFollowUp": "hr@acme.example.com",
                                  "status": "NEXT_STAGE",
                                  "notes": "Phone screen scheduled"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEXT_STAGE"));

        mockMvc.perform(get("/api/applications/stats")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").value(1))
                .andExpect(jsonPath("$.activeDays").value(1));

        mockMvc.perform(get("/api/applications/daily-counts")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].count").value(1));

        mockMvc.perform(get("/api/applications/status-counts")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.status == 'NEXT_STAGE')].count").value(1));

        MvcResult calendarResult = mockMvc.perform(post("/api/calendar/events")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Phone screen",
                                  "notes": "Prepare STAR stories",
                                  "startsAt": "2026-07-05T10:00:00",
                                  "endsAt": "2026-07-05T11:00:00",
                                  "allDay": false,
                                  "eventType": "INTERVIEW",
                                  "applicationId": "%s"
                                }
                                """.formatted(applicationId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Phone screen"))
                .andExpect(jsonPath("$.eventType").value("INTERVIEW"))
                .andReturn();

        JsonNode calendarBody = objectMapper.readTree(calendarResult.getResponse().getContentAsString());
        String eventId = calendarBody.get("id").asText();

        mockMvc.perform(get("/api/calendar/events")
                        .header("Authorization", "Bearer " + accessToken)
                        .param("from", "2026-07-01")
                        .param("to", "2026-07-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.title == 'Phone screen')].eventType").value("INTERVIEW"));

        mockMvc.perform(delete("/api/calendar/events/" + eventId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/applications/" + applicationId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/applications/stats")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").value(0));
    }

    @Test
    @Order(3)
    void authRateLimitReturnsTooManyRequests() throws Exception {
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "10.0.0.99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "email": "missing@applicationtracker.com",
                                      "password": "Password12345",
                                      "rememberMe": false
                                    }
                                    """))
                    .andExpect(status().isUnauthorized());
        }

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "10.0.0.99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "missing@applicationtracker.com",
                                  "password": "Password12345",
                                  "rememberMe": false
                                }
                                """))
                .andReturn();

        assertThat(result.getResponse().getStatus()).isEqualTo(429);
    }

    private String registerAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Production Test User",
                                  "email": "%s",
                                  "password": "Password12345",
                                  "acceptTerms": true
                                }
                                """.formatted(email)))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "Password12345",
                                  "rememberMe": false
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }
}
