import React from "react";
import "./welcome.css";
import {Col, Row} from "reactstrap";

export default function Welcome() {
  return (
    <div className="welcome-container">
        <div className="welcome-content">
          <h1>Welcome!</h1>
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
