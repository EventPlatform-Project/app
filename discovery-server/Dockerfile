# Image de base Java
FROM eclipse-temurin:17-jdk-alpine

# Dossier de travail
WORKDIR /app

# On copie le JAR généré depuis le dossier target
COPY target/*.jar app.jar

# Port par défaut d'Eureka (8761)
EXPOSE 8761

# Lancement du serveur de découverte
ENTRYPOINT ["java", "-jar", "app.jar"]