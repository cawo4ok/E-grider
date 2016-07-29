using System.Web;
using System.Web.Optimization;

namespace WebApplication4
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/respond.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/site.css"));
            
            bundles.Add(new LessBundle("~/App/Styles").IncludeDirectory("~/App/ui/Styles", "*.less"));

            bundles.Add(new ScriptBundle("~/bundles/Grid")
            .IncludeDirectory("~/App/ui", "*.js")
                .IncludeDirectory("~/App/ui/Directives", "*.js")
                .Include("~/Scripts/angular-vs-repeat.js")
                .Include("~/Scripts/angularNotification.js")
                .Include("~/Scripts/angular-drag-and-drop-lists.js")
                .IncludeDirectory("~/App/Controllers", "*.js"));

            bundles.Add(new ScriptBundle("~/bundles/GridApp")
                .Include("~/App/app.js"));
        }
    }
}