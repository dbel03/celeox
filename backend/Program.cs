using CeleoxApi.Services;
using CeleoxApi.Configuration;
using CeleoxApi.Data;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Servicios
builder.Services.AddSingleton<OsmService>();
builder.Services.AddSingleton<MountainRouteService>();

// OpenAPI
builder.Services.AddOpenApi();

// MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDB")
);

builder.Services.AddSingleton<MongoDbContext>();

// Backblaze B2
builder.Services.Configure<BackblazeSettings>(
    builder.Configuration.GetSection("Backblaze")
);

builder.Services.AddSingleton<BackblazeService>();

// RoutingService
builder.Services.AddSingleton(sp =>
{
    var backblaze = sp.GetRequiredService<BackblazeService>();
    var environment = sp.GetRequiredService<IWebHostEnvironment>();

    return RoutingService
        .CreateAsync(backblaze, environment)
        .GetAwaiter()
        .GetResult();
});

builder.Services.AddScoped<MountainFeatureService>();


var app = builder.Build();


// ==========================================
// Cargar RouterDb durante el arranque
// ==========================================

try
{
    _ = app.Services.GetRequiredService<RoutingService>();

    Console.WriteLine("======================================");
    Console.WriteLine("RouterDb cargado correctamente.");
    Console.WriteLine("======================================");
}
catch (Exception ex)
{
    Console.WriteLine("======================================");
    Console.WriteLine("AVISO: ROUTERDB NO DISPONIBLE");
    Console.WriteLine("La API continuará arrancando sin routing.");
    Console.WriteLine($"Motivo: {ex.Message}");
    Console.WriteLine("======================================");
}


// HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();