using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EventManagement.Data
{
    [Table("Role")]
    public class Role
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        public List<Users> Users { get; set; } = new();
    }
}
