import React from 'react';
import Banner from './Banner';
import BookingForm from './BookingForm';
import RoomsContent from './RoomsContent';


function Rooms() {
  return (
    <div className="room-page">
      <Banner />    
      <div className="divider"></div>
      <RoomsContent />
    </div>

  );
}

export default Rooms;