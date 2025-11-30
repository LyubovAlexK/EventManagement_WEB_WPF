using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventManagement.Data
{
    public class Users
    {
        public int UserId { get; set; }
        public string LastName { get; set; }
        public string Name { get; set; }
        public string MiddleName { get; set; }
        public string Phone { get; set; }
        public string? Specialty { get; set; }
        public string Login {  get; set; }
        public string Password { get; set; }
        public int RoleId { get; set; }

        public Role? Role { get; set; }
        public List<Event> Events { get; set; } = new();
    }
}
