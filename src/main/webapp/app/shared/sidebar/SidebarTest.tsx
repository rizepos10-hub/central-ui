import React, { useState } from 'react';
import './sidebartest.css';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from 'app/config/store';
import { Collapse } from 'reactstrap';
import {
  FaBars,
  FaCalendar,
  FaCalendarDay,
  FaChartArea,
  FaChartLine,
  FaCodeBranch,
  FaHome,
  FaMoon,
  FaPlusCircle,
  FaTags,
  FaThLarge,
  FaTrophy,
} from 'react-icons/fa';
import { MdAssessment, MdHistory, MdToday, MdViewModule } from 'react-icons/md';
import { WiDaySunny } from 'react-icons/wi';
import { AiOutlineShopping } from 'react-icons/ai';
import { IoBagCheckOutline } from 'react-icons/io5';
import { BsCart } from 'react-icons/bs';
import { FiMenu } from 'react-icons/fi';

const SidebarTest = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [openedItems, setOpenedItems] = useState([]);

  const account = useAppSelector(state => state.authentication.account);

  const menuItem = [
    {
      path: '/',
      name: 'Dashboard',
      icon: <FaChartArea />,
    },
    {
      path: '/branch?page=1&sort=id,asc',
      name: 'Branches',
      icon: <FaCodeBranch />,
    },
    {
      name: 'Orders',
      icon: <BsCart />,

      subItems: [
        { path: '/branch?page=1&sort=id,asc', name: 'Today ', icon: <MdToday /> },
        { path: '/item?page=1&sort=id,asc', name: 'History', icon: <MdHistory /> },
      ],
    },

    {
      name: 'Menus',
      icon: <FiMenu />,
      subItems: [
        { path: '/menu?page=1&sort=id,asc', name: 'List', icon: <FaBars /> },
        { path: '/term?page=1&sort=id,asc&taxonomyName=Menu%20Category', name: 'Category', icon: <FaTags /> },
      ],
    },

    {
      name: 'Catalogue',
      icon: <MdViewModule />,
      subItems: [
        { path: '/item?page=1&sort=id,asc', name: 'Items', icon: <FaThLarge /> },
        { path: '/term?page=1&sort=id,asc&taxonomyName=Item%20Category', name: 'Category', icon: <FaTags /> },
        { path: '/addon?page=1&sort=id,asc', name: 'Addons', icon: <FaPlusCircle /> },
      ],
    },

    {
      name: 'Inventory',
      icon: <MdAssessment />,
      path: '/',
    },
    {
      name: 'Analytics',
      icon: <FaChartLine />,
      subItems: [
        { path: '/term?page=1&sort=id,asc', name: 'Top Items', icon: <FaTrophy /> },
        { path: '/addon?page=1&sort=id,asc', name: 'End Of Day', icon: <FaMoon /> },
      ],
    },
  ];

  // const handleEntitiesClick = () => {
  //   setIsOpen((prevState) => !prevState);
  // };

  const handleEntitiesClick = index => {
    setOpenedItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = !newItems[index];
      return newItems;
    });
  };

  return (
    <div style={{ backgroundColor: 'whitesmoke' }}>
      <div className="admin-container">
        <div className="admin-sidebar">
          <div className="admin-top_section">
            <h1 className="admin-logo">{account.firstName}</h1>
            <div className="admin-bars flex justify-center">
              <img
                style={{ height: '10rem', width: '10rem' }}
                src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
                alt="profile pic"
              />
            </div>
            <div className="admin-menu-items">
              {menuItem.map((item, index) => (
                <React.Fragment key={index}>
                  {item.subItems?.length > 0 ? (
                    <div
                      className="admin-link"
                      onClick={() => handleEntitiesClick(index)} // Pass the item index to the click handler
                    >
                      {/* Add the triangle icon for items with subItems */}
                      {item.subItems?.length > 0 && <div className={`triangle ${openedItems[index] ? 'active' : ''}`}></div>}
                      <div className="admin-icon">{item.icon}</div>
                      <div className="admin-link_text">{item.name}</div>
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className="admin-link"
                      onClick={() => setOpenedItems([])} // Close all subItems when clicking a non-subItem link
                    >
                      <div className="admin-icon">{item.icon}</div>
                      <div className="admin-link_text">{item.name}</div>
                    </NavLink>
                  )}
                  {item.subItems?.length > 0 && (
                    <Collapse isOpen={openedItems[index]}>
                      <ul>
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <NavLink
                              to={subItem.path}
                              className="admin-link"
                              onClick={() => setOpenedItems([])} // Close all subItems when clicking a subItem link
                            >
                              <div className="admin-icon">{subItem.icon}</div>
                              <div className="admin-link_text">{subItem.name}</div>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarTest;
