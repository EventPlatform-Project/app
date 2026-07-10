# =====================================================================
# Multi-stage Dockerfile for ticket-service.
# =====================================================================

# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -q -e -DskipTests dependency:go-offline

COPY src ./src
# Package + pick the Spring Boot fat jar (skip *-plain.jar and *.jar.original
# that Maven can also produce depending on the plugin config).
RUN mvn -B -q -e -DskipTests package \
 && jar=$(ls target/*.jar 2>/dev/null | grep -v -E '\-plain\.jar$|\.jar\.original$' | head -1) \
 && test -n "$jar" \
 && cp "$jar" /workspace/app.jar

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/app.jar app.jar

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
