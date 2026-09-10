// ============================================================
// GitHub Technology Detector
// ============================================================
//
// Detects programming languages and technologies from
// repository files.
//
// No AI.
// No ML.
// No model.
//
// Everything is deterministic.
// ============================================================


// ------------------------------------------------------------
// package.json
// ------------------------------------------------------------

const detectFromPackageJson = (packageJson) => {

    const technologies = new Set();

    const dependencies = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {})
    };


    if (dependencies.react) {
        technologies.add("ReactJS");
    }

    if (dependencies.next) {
        technologies.add("NextJS");
    }

    if (dependencies["react-native"]) {
        technologies.add("React Native");
    }

    if (dependencies.express) {
        technologies.add("Express");
        technologies.add("NodeJS");
    }

    if (
        dependencies.redux ||
        dependencies["@reduxjs/toolkit"]
    ) {
        technologies.add("Redux");
    }

    if (
        dependencies["react-router"] ||
        dependencies["react-router-dom"]
    ) {
        technologies.add("React Router");
    }

    if (dependencies.vite) {
        technologies.add("Vite");
    }

    if (dependencies.axios) {
        technologies.add("Axios");
    }

    if (dependencies.tailwindcss) {
        technologies.add("Tailwind CSS");
    }

    if (
        dependencies.bootstrap ||
        dependencies["react-bootstrap"]
    ) {
        technologies.add("Bootstrap");
    }

    if (dependencies["@mui/material"]) {
        technologies.add("Material UI");
    }

    if (
        dependencies["@prisma/client"] ||
        dependencies.prisma
    ) {
        technologies.add("Prisma");
    }

    if (dependencies.mongoose) {
        technologies.add("MongoDB");
        technologies.add("Mongoose");
    }

    if (dependencies.sequelize) {
        technologies.add("Sequelize");
    }

    if (
        dependencies["socket.io"] ||
        dependencies["socket.io-client"]
    ) {
        technologies.add("Socket.IO");
    }

    if (
        dependencies.firebase ||
        dependencies["firebase-admin"]
    ) {
        technologies.add("Firebase");
    }

    return [...technologies];
};


// ------------------------------------------------------------
// requirements.txt
// ------------------------------------------------------------

const detectFromRequirementsTxt = (content) => {

    const technologies = new Set();

    const lines = content
        .split(/\r?\n/)
        .map(line => line.trim().toLowerCase());


    if (
        lines.some(line =>
            /^(django)([<>=!~]|$)/.test(line)
        )
    ) {
        technologies.add("Django");
    }

    if (
        lines.some(line =>
            /^(flask)([<>=!~]|$)/.test(line)
        )
    ) {
        technologies.add("Flask");
    }

    if (
        lines.some(line =>
            /^(fastapi)([<>=!~]|$)/.test(line)
        )
    ) {
        technologies.add("FastAPI");
    }

    if (
        lines.some(line =>
            /^(pandas)([<>=!~]|$)/.test(line)
        )
    ) {
        technologies.add("Pandas");
    }

    if (
        lines.some(line =>
            /^(numpy)([<>=!~]|$)/.test(line)
        )
    ) {
        technologies.add("NumPy");
    }

    if (
        lines.some(line =>
            /^(tensorflow)([<>=!~]|$)/.test(line)
        )
    ) {
        technologies.add("TensorFlow");
    }

    if (
        lines.some(line =>
            /^(torch|pytorch)([<>=!~]|$)/.test(line)
        )
    ) {
        technologies.add("PyTorch");
    }

    if (
        lines.some(line =>
            /^(scikit-learn)([<>=!~]|$)/.test(line)
        )
    ) {
        technologies.add("Scikit-learn");
    }

    return [...technologies];
};


// ------------------------------------------------------------
// pubspec.yaml
// ------------------------------------------------------------

const detectFromPubspecYaml = (content) => {

    const technologies = new Set();

    const text = content.toLowerCase();


    if (text.includes("flutter:")) {
        technologies.add("Flutter");
    }

    if (text.includes("firebase_core:")) {
        technologies.add("Firebase");
    }

    if (text.includes("provider:")) {
        technologies.add("Provider");
    }

    if (text.includes("flutter_riverpod:")) {
        technologies.add("Riverpod");
    }

    if (text.includes("\n  get:") ||
        text.includes("\nget:")) {
        technologies.add("GetX");
    }

    if (text.includes("flutter_bloc:")) {
        technologies.add("BLoC");
    }

    return [...technologies];
};


// ------------------------------------------------------------
// pom.xml
// ------------------------------------------------------------

const detectFromPomXml = (content) => {

    const technologies = new Set();

    const text = content.toLowerCase();


    if (text.includes("spring-boot")) {
        technologies.add("Spring Boot");
    }

    if (
        text.includes("spring-context") ||
        text.includes("spring-core")
    ) {
        technologies.add("Spring");
    }

    if (text.includes("hibernate-core")) {
        technologies.add("Hibernate");
    }

    if (text.includes("mysql-connector")) {
        technologies.add("MySQL");
    }

    if (text.includes("postgresql")) {
        technologies.add("PostgreSQL");
    }

    return [...technologies];
};


// ------------------------------------------------------------
// build.gradle
// ------------------------------------------------------------

const detectFromBuildGradle = (content) => {

    const technologies = new Set();

    const text = content.toLowerCase();


    if (
        text.includes("com.android.application") ||
        text.includes("com.android.library")
    ) {
        technologies.add("Android");
    }

    if (text.includes("kotlin")) {
        technologies.add("Kotlin");
    }

    if (text.includes("spring-boot")) {
        technologies.add("Spring Boot");
    }

    if (text.includes("hibernate")) {
        technologies.add("Hibernate");
    }

    return [...technologies];
};


// ------------------------------------------------------------
// .csproj
// ------------------------------------------------------------

const detectFromCsproj = (content) => {

    const technologies = new Set();

    const text = content.toLowerCase();


    if (text.includes("microsoft.aspnetcore")) {
        technologies.add("ASP.NET");
    }

    if (text.includes("entityframeworkcore")) {
        technologies.add("Entity Framework");
    }

    if (
        text.includes("microsoft.netcore") ||
        text.includes("microsoft.aspnetcore") ||
        text.includes("microsoft.extensions")
    ) {
        technologies.add(".NET");
    }

    return [...technologies];
};


// ------------------------------------------------------------
// Cargo.toml
// ------------------------------------------------------------

const detectFromCargoToml = (content) => {

    const technologies = new Set();

    const text = content.toLowerCase();


    if (text.includes("[package]")) {
        technologies.add("Rust");
    }

    if (text.includes("actix-web")) {
        technologies.add("Actix");
    }

    if (text.includes("rocket")) {
        technologies.add("Rocket");
    }

    return [...technologies];
};


// ------------------------------------------------------------
// MAIN DETECTOR
// ------------------------------------------------------------

const detectTechnologies = (files) => {

    const technologies = new Set();


    if (files.packageJson) {

        detectFromPackageJson(files.packageJson)
            .forEach(skill =>
                technologies.add(skill)
            );
    }


    if (files.requirementsTxt) {

        detectFromRequirementsTxt(files.requirementsTxt)
            .forEach(skill =>
                technologies.add(skill)
            );
    }


    if (files.pubspecYaml) {

        detectFromPubspecYaml(files.pubspecYaml)
            .forEach(skill =>
                technologies.add(skill)
            );
    }


    if (files.pomXml) {

        detectFromPomXml(files.pomXml)
            .forEach(skill =>
                technologies.add(skill)
            );
    }


    if (files.buildGradle) {

        detectFromBuildGradle(files.buildGradle)
            .forEach(skill =>
                technologies.add(skill)
            );
    }


    if (files.csproj) {

        detectFromCsproj(files.csproj)
            .forEach(skill =>
                technologies.add(skill)
            );
    }


    if (files.cargoToml) {

        detectFromCargoToml(files.cargoToml)
            .forEach(skill =>
                technologies.add(skill)
            );
    }


    return [...technologies];
};


// ------------------------------------------------------------
// Skill categories
// ------------------------------------------------------------

const skillCategoryMap = {

    HTML: "Frontend",
    CSS: "Frontend",
    JavaScript: "Programming",
    TypeScript: "Programming",
    Python: "Programming",
    Java: "Programming",
    "C++": "Programming",
    "C#": "Programming",
    Dart: "Programming",
    Rust: "Programming",
    Go: "Programming",
    Kotlin: "Programming",

    ReactJS: "Frontend",
    NextJS: "Frontend",
    "React Native": "Mobile",
    "React Router": "Frontend",
    Redux: "Frontend",
    "Tailwind CSS": "Frontend",
    Bootstrap: "Frontend",
    "Material UI": "Frontend",

    NodeJS: "Backend",
    Express: "Backend",
    Django: "Backend",
    Flask: "Backend",
    FastAPI: "Backend",
    Spring: "Backend",
    "Spring Boot": "Backend",
    Hibernate: "Backend",
    ".NET": "Backend",

    Flutter: "Mobile",
    Android: "Mobile",

    Firebase: "Database",
    MongoDB: "Database",
    MySQL: "Database",
    PostgreSQL: "Database",
    Prisma: "Database",
    Mongoose: "Database",
    Sequelize: "Database",

    Pandas: "Data",
    NumPy: "Data",

    TensorFlow: "AI/ML",
    PyTorch: "AI/ML",
    "Scikit-learn": "AI/ML"
};


module.exports = {
    detectTechnologies,
    skillCategoryMap
};