using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EventManagement.Data;

namespace EventManagement.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationContext _context;

    public UsersController(ApplicationContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _context.Users
            .Include(u => u.Role)
            .Select(u => new UserDto
            {
                UserId = u.UserId,
                LastName = u.LastName,
                Name = u.Name,
                MiddleName = u.MiddleName,
                Phone = u.Phone,
                Specialty = u.Specialty,
                Login = u.Login,
                RoleId = u.RoleId,
                RoleName = u.Role.RoleName
            })
            .ToListAsync();

        return users;
    }

    [HttpPost]
    public async Task<ActionResult<Users>> PostUser(Users user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetUsers", new { id = user.UserId }, user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutUser(int id, Users user)
    {
        if (id != user.UserId)
            return BadRequest();

        _context.Entry(user).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!UserExists(id))
                return NotFound();
            else
                throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound();

        // Проверка на связанные события
        var hasEvents = await _context.Event.AnyAsync(e => e.UserId == id);
        if (hasEvents)
            return BadRequest(new { message = "Невозможно удалить пользователя, так как с ним связаны события" });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool UserExists(int id)
    {
        return _context.Users.Any(e => e.UserId == id);
    }
}

public class UserDto
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