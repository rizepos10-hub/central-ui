import React from 'react';

const ImageDisplay = ({ imageType, imageUrl = null, style={} , className = '', height, width}) => {

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
      <img src={selectedImageUrl} height={height} width={width} alt={imageType} className={className} style={{ ...style }} />
  );
};

export default ImageDisplay;
