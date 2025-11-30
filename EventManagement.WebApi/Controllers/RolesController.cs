using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EventManagement.Data;

namespace EventManagement.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly ApplicationContext _context;

    public RolesController(ApplicationContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Role>>> GetRoles()
    {
        return await _context.Roles.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Role>> PostRole(Role role)
    {
        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetRoles", new { id = role.RoleId }, role);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutRole(int id, Role role)
    {
        if (id != role.RoleId)
            return BadRequest();

        _context.Entry(role).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!RoleExists(id))
                return NotFound();
            else
                throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(int id)
    {
        var role = await _context.Roles.FindAsync(id);
        if (role == null)
            return NotFound();

        // Проверка на связанных пользователей
        var hasUsers = await _context.Users.AnyAsync(u => u.RoleId == id);
        if (hasUsers)
            return BadRequest(new { message = "Невозможно удалить роль, так как с ней связаны пользователи" });

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool RoleExists(int id)
    {
        return _context.Roles.Any(e => e.RoleId == id);
    }
}