package com.smartevent.feedbackservice.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares an HTTP-Bearer security scheme on the OpenAPI spec so the
 * Swagger UI (both the per-service one and the aggregated gateway UI)
 * exposes an "Authorize" button. Paste a Keycloak JWT there to try any
 * protected endpoint.
 */
@Configuration
public class OpenApiConfig {

    private static final String SCHEME = "bearerAuth";

    @Bean
    public OpenAPI feedbackServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Feedback service API").version("v1"))
                .addSecurityItem(new SecurityRequirement().addList(SCHEME))
                .components(new Components().addSecuritySchemes(
                        SCHEME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Keycloak access token (Bearer <token>)")
                ));
    }
}
