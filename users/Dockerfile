# =====================================================================
# Multi-stage Dockerfile for users-service.
# Stage 1 builds the fat jar with Maven (no local install required).
# Stage 2 keeps only the JRE + the jar for a small runtime image.
# =====================================================================

# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

# Cache dependencies first so code-only changes don't re-download everything.
COPY pom.xml ./
RUN mvn -B -q -e -DskipTests dependency:go-offline

# Now bring in the sources and package.
# Pick the Spring Boot fat jar (skip *-plain.jar / *.jar.original that Maven
# may also produce depending on the plugin configuration).
COPY src ./src
RUN mvn -B -q -e -DskipTests package \
 && jar=$(ls target/*.jar 2>/dev/null | grep -v -E '\-plain\.jar$|\.jar\.original$' | head -1) \
 && test -n "$jar" \
 && cp "$jar" /workspace/app.jar

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/app.jar app.jar

# Users-service listens on 7890 (see config-repo/users-service.properties).
EXPOSE 7890

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
