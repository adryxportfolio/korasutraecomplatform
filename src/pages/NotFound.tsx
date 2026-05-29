import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found - Korasutra | 404 Error</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to Kora Sutra to browse our handcrafted sarees collection." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <h1 className="mb-4 text-6xl font-heading font-light text-primary">404</h1>
          <h2 className="mb-4 text-2xl font-heading">Page Not Found</h2>
          <p className="mb-8 text-muted-foreground font-body">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to our beautiful saree collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Return Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/collections/all">
                <Search className="w-4 h-4 mr-2" />
                Browse Sarees
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
