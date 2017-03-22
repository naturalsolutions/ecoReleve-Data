from ..Models import Project, ProjectList
from . import DynamicObjectCollectionView, DynamicObjectView
from ..controllers.security import RootCore, context_permissions
from ..utils.generator import Generator


class ProjectView(DynamicObjectView):

    model = Project


class ProjectsView(DynamicObjectCollectionView):

    Collection = ProjectList
    item = ProjectView

    moduleFormName = 'ProjectForm'
    moduleGridName = 'ProjectGrid'

    def __init__(self, ref, parent):
        DynamicObjectCollectionView.__init__(self, ref, parent)
        self.__acl__ = context_permissions[ref]


RootCore.listChildren.append(('projects', ProjectsView))
