from ..Models import Project
from . import CustomView

class ProjectView(CustomView):

    model = Project


class ProjectsView(CustomView):

    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'
