import { Link } from 'react-router-dom';

function Sidebar() {
  const navItems = [
    { icon: '🏠', name: 'Home', path: '/' },
    { icon: '➕', name: 'Create Post', path: '/create' },
    { icon: '✉️', name: 'Conversations', path: '/conversations' },
    { icon: '👤', name: 'Profile', path: '/profile' },
  ];

  return (
    <div className="p-4">
      <h1 className="font-bold text-2xl mb-8 text-blue-600">Affinity</h1>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-4">
              <Link
                to={item.path}
                className="flex items-center p-2 text-lg font-semibold rounded-lg hover:bg-gray-200"
              >
                <span className="mr-4">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;