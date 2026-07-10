package com.smartevent.ticketservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

import java.util.*;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                                         "/api/tickets/v3/api-docs/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        // Public ticket viewing (QR scan by non-authenticated staff)
                        .requestMatchers(HttpMethod.GET, "/api/tickets/*/view", "/api/tickets/*/qrcode").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter()))
                );

        return http.build();
    }

    /**
     * NOT a {@code @Bean}: exposing a raw {@code Converter<Jwt, AbstractAuthenticationToken>}
     * bean breaks {@code mvcConversionService} initialization
     * ("Unable to determine source type &lt;S&gt; and target type &lt;T&gt;").
     */
    private Converter<Jwt, AbstractAuthenticationToken> jwtAuthConverter() {
        return jwt -> {
            Set<GrantedAuthority> authorities = new HashSet<>();

            Object realmAccess = jwt.getClaim("realm_access");
            if (realmAccess instanceof Map<?, ?> ra && ra.get("roles") instanceof Collection<?> roles) {
                for (Object r : roles) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + r.toString()));
                }
            }

            Object resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess instanceof Map<?, ?> raMap) {
                for (Object client : raMap.values()) {
                    if (client instanceof Map<?, ?> cm && cm.get("roles") instanceof Collection<?> roles) {
                        for (Object r : roles) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_" + r.toString()));
                        }
                    }
                }
            }

            return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
        };
    }
}
