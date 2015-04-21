from numpy import sin, cos, arcsin, sqrt, radians

earth_radius = 6367.0

def haversine(X, Y):
   """Return haversine distance between two arrays of points.
   
   Parameters
   ----------
   X, Y : ndarray[n_points, 2]
       The points in (lat, lon) format.

   Returns
   -------
   ndarray[n_points,]
       The distances.

   """
   X, Y = radians(X), radians(Y)
   delta_lat, delta_lon = X[:,0] - Y[:,0], X[:,1] - Y[:,1]
   distances = arcsin(sqrt(sin(.5*delta_lat)**2+cos(X[:,0])*cos(Y[:,0])*sin(.5*delta_lon)**2))
   return  2. * earth_radius * distances