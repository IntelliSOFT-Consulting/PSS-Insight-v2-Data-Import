import Template from '../Pages/Template';
import Upload from '../Pages/Upload';

const routes = [
  {
    path: '/',
    element: Template,
  },
  {
    path: '/upload',
    element: Upload,
  },
];

export default routes;