using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApplication4.Models
{
    
    public class Product
    {
        public int Id { get; set; }
        public int Number{ get; set; }
        public string Text1 { get; set; }
        public string Text2 { get; set; }
        public string Text3 { get; set; }

        public Product(int id, int number, string text1, string text2, string text3)
        {
            Id = id;
            Number = number;
            Text1 = text1;
            Text2 = text2;
            Text3 = text3;
        }
    }
    public class Filter
    {
        public string field { get; set; }
        public string value { get; set; }
        
    }
    public class Item
    {
        public string name { get; set; }
        public string language { get; set; }
        public string gameName { get; set; }
        public int gameBought { get; set; }
        public int bankBalance { get; set; }
        public byte rating { get; set; }
        public int totalWinnings { get; set; }
    }
    public class Parameters
    {
        public string column { get; set; }
        public string order { get; set; }
        public Filter[] filter { get; set; }
        public string field { get; set; }
        public int endIndex { get; set; }
        public int startIndex { get; set; }
    }
}