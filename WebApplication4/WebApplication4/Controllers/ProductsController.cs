using WebApplication4.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Script;
using System.Web.Script.Serialization;
using System.Reflection;

namespace WebApplication4.Controllers
{
    public class ProductsController : ApiController
    {

        public static List<Product> LIST = new List<Product>();
        
        static ProductsController()
        {
            LIST = new List<Product>();
            Random rnd = new Random();
            for (int i = 1; i <= 5000; i++)
            {
                LIST.Add(new Product(100 - i, rnd.Next(1, 130) - 31 + i, "Hammer" + rnd.Next(1, 20) + i, "Hardware" + rnd.Next(1, 40) + i, "Something" + rnd.Next(56, 80) + i));
            }
           
        }

        [HttpGet]
        public IEnumerable<Product> GetAllProducts()
        {
            return LIST;
        }

        
        [HttpPost]
        public IEnumerable<Product> Post(Parameters product)
        {
            
            if (product != null)
            {
                if (product.column == "Number")
                {
                    LIST.Sort(delegate(Product x, Product y) { return x.Number.CompareTo(y.Number); }); 
                }
                if (product.column == "Text1")
                {
                    LIST.Sort(delegate(Product x, Product y) { return x.Text1.CompareTo(y.Text1); });
                }
                if (product.column == "Text2")
                {
                    LIST.Sort(delegate(Product x, Product y) { return x.Text2.CompareTo(y.Text2); });
                }
                if (product.column == "Text3")
                {
                    LIST.Sort(delegate(Product x, Product y) { return x.Text3.CompareTo(y.Text3); });
                }
                if (product.order == "desc")
                {
                    LIST.Reverse();
                }

                List<Product> list = new List<Product>();
                list.Clear();
                list = new List<Product>();


                list = LIST.Skip(product.startIndex).Take(product.endIndex - product.startIndex).ToList();
                    if (product.filter.Length > 0)
                    {
                        List<Product> listFiltered = new List<Product>();
                        for (int i = 0; i < product.filter.Length; i++)
                        {
                            if (i > 0)
                            {
                                list = new List<Product>();
                                for (int k = 0; k < listFiltered.Count; k++)
                                {
                                    list.Add(listFiltered[k]);
                                }
                            }
                            listFiltered.Clear();
                            listFiltered = new List<Product>();

                            if (product.filter[i].field == "Text3")
                            {
                                for (int j = 0; j < list.Count; j++)
                                {
                                    if (list[j].Text3.Contains(product.filter[i].value))
                                    {
                                        listFiltered.Add(list[j]);
                                    }
                                }

                            }

                            if (product.filter[i].field == "Number")
                            {
                                for (int j = 0; j < list.Count; j++)
                                {
                                    var valueList = list[j].Number.ToString();
                                    var valueProduct = product.filter[i].value.ToString();
                                    if (valueList.Contains(valueProduct))
                                    {
                                        listFiltered.Add(list[j]);
                                    }
                                }
                            }

                            if (product.filter[i].field == "Text1")
                            {
                                for (int j = 0; j < list.Count; j++)
                                {
                                    if (list[j].Text1.Contains(product.filter[i].value))
                                    {
                                        listFiltered.Add(list[j]);
                                    }
                                }
                            }

                            if (product.filter[i].field == "Text2")
                            {
                                for (int j = 0; j < list.Count; j++)
                                {

                                    if (list[j].Text2.Contains(product.filter[i].value))
                                    {
                                        listFiltered.Add(list[j]);
                                    }
                                }
                            }
                        }
                        return listFiltered;
                    }
                    else
                    {
                        return list;
                    }
                
            }
            else
            {
                throw new HttpResponseException(HttpStatusCode.NotFound);
            }
        }
    }
}
