import React from 'react';

const ImageDisplay = ({ imageType, imageUrl = null, style={} }) => {

  let selectedImageUrl = "" ;

  if(imageUrl){
    // if there is an imageUrl then get the image
    selectedImageUrl = imageUrl;
  }else{
    // if there is no imageUrl then set the default image based on the type
    if(imageType === "user"){
      selectedImageUrl = "/content/images/default-user.png"
    }
    else if(imageType === "product"){
      selectedImageUrl = "/content/images/default-product.svg";
    }
    else if(imageType === "category"){
      selectedImageUrl = "/content/images/default-category.svg";
    }
  }

  return (
    <div>
      <h2>Image Display</h2>
      <img src={selectedImageUrl} alt={imageType} style={{ width:"40px",height:"40px", ...style }} />
    </div>
  );
};

export default ImageDisplay;
