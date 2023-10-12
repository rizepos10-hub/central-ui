import React from "react";
import "./welcome.css";
import {Col, Row} from "reactstrap";
import {useLocation} from "react-router-dom";

export default function Welcome()
{
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const showWelcome = queryParams.has("welcome");

  console.log(showWelcome,' lol')

  return (
    <div className="welcome-container">
        <div className="welcome-content">
          {showWelcome &&
          <div>
            <span className="color-cycle">W</span>
            <span className="color-cycle">e</span>
            <span className="color-cycle">l</span>
            <span className="color-cycle">c</span>
            <span className="color-cycle">o</span>
            <span className="color-cycle">m</span>
            <span className="color-cycle">e</span>
            <span className="color-cycle">!</span>
          </div>   }
          <h2 className={`${showWelcome ? "welcome-instructions" : "instructions"}`}>Instructions</h2>
        </div>

          <div className="steps-column">

        <div className="step">
          <h2>Step 1</h2>
          <p>
            In Step 1, you'll embark on a journey towards effortless management of your business. Our Cloud POS system provides you with the power to streamline your transactions, track inventory, and serve your customers with ease. Click below to explore the possibilities:
          </p>
          <a href="#">Download Here</a>

        </div>
        <div className="step">
          <h2>Step 2</h2>
          <p>
            Step 2 takes you to new heights in efficiency. With our cloud-based solution, you can access valuable features such as real-time sales analytics and customer relationship management. Elevate your business operations by clicking the link below:
          </p>
          <a href="#">Learn More</a>

        </div>
      </div>


    </div>
  );
}
