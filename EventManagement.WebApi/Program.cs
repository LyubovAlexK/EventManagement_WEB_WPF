using Microsoft.EntityFrameworkCore;
using EventManagement.Data;

var builder = WebApplication.CreateBuilder(args);

// Добавление контекста БД
builder.Services.AddDbContext<ApplicationContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Настройка CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Обслуживание статических файлов
app.UseDefaultFiles();
app.UseStaticFiles();

// Для SPA маршрутизации
app.MapFallbackToFile("index.html");

app.UseAuthorization();
app.MapControllers();

app.Run();