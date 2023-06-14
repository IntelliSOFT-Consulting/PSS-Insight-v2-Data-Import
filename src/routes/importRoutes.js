import Template from '../Pages/Template';
import Upload from '../Pages/Upload';
import Export from '../Pages/Export';

const routes = [
  {
    path: '/',
    element: Template,
  },
  {
    path: '/upload',
    element: Upload,
  },
  {
    path: '/export',
    element: Export,
  },
];

export default routes;
