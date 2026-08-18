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

WORKDIR /app

COPY --from=backend-build /app/publish .

COPY --from=frontend-build /app/frontend/dist ./wwwroot

ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}

ENTRYPOINT ["dotnet", "CeleoxApi.dll"]