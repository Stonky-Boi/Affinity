function Sidebar() {
  // In a real app, these would be <Link> components from a routing library
  const navItems = [
    { icon: '🏠', name: 'Home' },
    { icon: '✉️', name: 'Conversations' },
    { icon: '👤', name: 'Profile' },
  ];

  return (
    <div className="p-4">
      <h1 className="font-bold text-2xl mb-8 text-blue-600">Affinity</h1>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="mb-4">
              <a
                href="#"
                className="flex items-center p-2 text-lg font-semibold rounded-lg hover:bg-gray-200"
              >
                <span className="mr-4">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;