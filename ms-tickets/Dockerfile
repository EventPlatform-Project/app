# 1. On part d'une image Java légère (Alpine)
FROM eclipse-temurin:17-jdk-alpine

# 2. On définit le dossier de travail dans le conteneur
WORKDIR /app

# 3. On COPIE le fichier JAR que tu as généré avec IntelliJ
# Le "*" permet de prendre le JAR quel que soit son nom exact (version, etc.)
COPY target/*.jar app.jar

# 4. On dit à Docker de lancer le JAR au démarrage
ENTRYPOINT ["java", "-jar", "app.jar"]