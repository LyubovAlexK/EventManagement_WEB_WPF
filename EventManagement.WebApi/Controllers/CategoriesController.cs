using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EventManagement.Data;

namespace EventManagement.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationContext _context;

    public CategoriesController(ApplicationContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EventCategories>>> GetCategories()
    {
        return await _context.EventCategories.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EventCategories>> GetCategory(int id)
    {
        var category = await _context.EventCategories.FindAsync(id);
        if (category == null)
            return NotFound();

        return category;
    }

    [HttpPost]
    public async Task<ActionResult<EventCategories>> PostCategory(EventCategories category)
    {
        _context.EventCategories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetCategory", new { id = category.CategoryId }, category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutCategory(int id, EventCategories category)
    {
        if (id != category.CategoryId)
            return BadRequest();

        _context.Entry(category).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!CategoryExists(id))
                return NotFound();
            else
                throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.EventCategories.FindAsync(id);
        if (category == null)
            return NotFound();

        // Проверка на связанные события
        var hasEvents = await _context.Event.AnyAsync(e => e.CategoryId == id);
        if (hasEvents)
            return BadRequest(new { message = "Невозможно удалить категорию, так как с ней связаны события" });

        _context.EventCategories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool CategoryExists(int id)
    {
        return _context.EventCategories.Any(e => e.CategoryId == id);
    }
}