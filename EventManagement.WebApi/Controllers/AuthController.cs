using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EventManagement.Data;

namespace EventManagement.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationContext _context;

    public AuthController(ApplicationContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Login == request.Login && u.Password == request.Password);

        if (user == null)
            return Unauthorized(new { message = "Неверный логин или пароль" });

        var response = new LoginResponse
        {
            UserId = user.UserId,
            LastName = user.LastName,
            Name = user.Name,
            MiddleName = user.MiddleName,
            Phone = user.Phone,
            Specialty = user.Specialty,
            Login = user.Login,
            RoleId = user.RoleId,
            RoleName = user.Role?.RoleName
        };

        return response;
    }
}

public class LoginRequest
{
    public string Login { get; set; }
    public string Password { get; set; }
}

public class LoginResponse
{
    public int UserId { get; set; }
    public string LastName { get; set; }
    public string Name { get; set; }
    public string MiddleName { get; set; }
    public string Phone { get; set; }
    public string Specialty { get; set; }
    public string Login { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; }
}