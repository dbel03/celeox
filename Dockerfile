# ============================
# 1. BUILD FRONTEND
# ============================
FROM node:24 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ============================
# 2. BUILD BACKEND
# ============================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY backend/ ./backend/
RUN dotnet restore ./backend/CeleoxApi.csproj
RUN dotnet publish ./backend/CeleoxApi.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ============================
# 3. FINAL IMAGE
# ============================
FROM mcr.microsoft.com/dotnet/aspnet:10.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    libfontconfig1 \
    libfreetype6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/frontend/dist ./wwwroot

# Evita el crash por límite de inotify en contenedores
ENV DOTNET_hostBuilder__reloadConfigOnChange=false

# El puerto se resuelve en runtime, no en build
ENTRYPOINT ["/bin/sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:$PORT dotnet CeleoxApi.dll"]