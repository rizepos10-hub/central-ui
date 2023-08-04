
import React, {useState} from "react";
import "./sidebarMenu.css";
import {NavLink} from "react-router-dom";
import {useAppSelector} from "app/config/store";
import {Collapse} from "reactstrap";
import {
  FaBars,
  FaCalendar,
  FaCalendarDay, FaChartArea, FaChartLine,
  FaCodeBranch,
  FaHome, FaMoon,
  FaPlusCircle,
  FaTags,
  FaThLarge,
  FaTrophy, FaUser
} from "react-icons/fa";
import {MdAssessment, MdHistory, MdToday, MdViewModule} from "react-icons/md";
import {WiDaySunny} from "react-icons/wi";
import {AiOutlineFileText, AiOutlineShopping} from "react-icons/ai";
import {IoBagCheckOutline} from "react-icons/io5";
import {BsCart} from "react-icons/bs";
import {FiMenu} from "react-icons/fi";
import { useNavigate } from "react-router-dom"; // Import useHistory

const SidebarMenu = () => {

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const [openedItems, setOpenedItems] = useState([])

  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

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
      name: "Orders", icon: <BsCart />,

      subItems: [
        { path: "/branch?page=1&sort=id,asc", name: "Today " , icon: <MdToday /> },
        { path: "/order?page=1&sort=id,asc", name: "History" ,   icon: <MdHistory />},
      ],
    },

    {
      name: "Menus", icon: <FiMenu />,
      subItems: [
        { path: "/menu?page=1&sort=id,asc", name: "List"  , icon: <FaBars />  },
        { path: "/term/menus?page=1&sort=id,asc", name: "Category", icon: <FaTags />  },
      ],
    },

    {
      name: "Catalogue", icon:  <MdViewModule />,
      subItems: [
        { path: "/item?page=1&sort=id,asc", name: "Items"  , icon: <FaThLarge />  },
        { path: "/term/items?page=1&sort=id,asc", name: "Category"  , icon: <FaTags /> },
        { path: "/addon?page=1&sort=id,asc", name: "Addons" , icon: <FaPlusCircle />},
      ],
    },

    {
      name: "Inventory", icon:  <MdAssessment /> ,path: "/"
    },
    {
      name: "Analytics", icon: <FaChartLine/>,
      subItems: [
        { path: "/analytics/topItems", name: "Top Items" ,  icon: <FaTrophy/>},
        { path: "/addon?page=1&sort=id,asc", name: "End Of Day", icon: <FaMoon/> },
        { path: "/analytics/reports", name: "Report", icon: <AiOutlineFileText/> },

      ],
    },
    {
      name: "Customers", icon:  <FaUser /> ,path: "/"
    },

  ];

  // const handleEntitiesClick = () => {
  //   setIsOpen((prevState) => !prevState);
  // };


  const handleEntitiesClick = (index) => {
    setSelectedItemIndex(index);
    setOpenedItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = !newItems[index];
      return newItems;
    });
  };

  return (
    <div style={{ backgroundColor: "whitesmoke" }}>
      <div className="admin-container">
        <div className="admin-sidebar">
          <div className="admin-top_section">
            <div className="admin-menu-items">
              {menuItem.map((item, index) => (
                <React.Fragment key={index}>
                  <div
                    className={`admin-link ${
                      selectedItemIndex === index ? "selected" : ""
                    }`}
                    onClick={() => {
                      if (item.subItems?.length > 0) {
                        handleEntitiesClick(index);
                      } else {
                        navigate(item.path);
                        setSelectedItemIndex(index);
                      }
                    }}
                  >
                    {item.subItems?.length > 0 && (
                      <div
                        className={`triangle ${
                          openedItems[index] ? "active" : ""
                        }`}
                      ></div>
                    )}
                    <div className="admin-icon">{item.icon}</div>
                    <div className="admin-link_text">{item.name}</div>
                  </div>
                  {item.subItems?.length > 0 && (
                    <Collapse isOpen={openedItems[index]}>
                      <ul>
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <NavLink
                              to={subItem.path}
                              className="admin-link no-underline"
                              onClick={() => setOpenedItems([])}
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

export default SidebarMenu;
