import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';

function Profile() {

    const username = 'Jack'
    const [className, setClassName] = useState('');
  const handleClassNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setClassName(e.target.value)
  };
  axios.post('http://localhost:8080/classSearch', { class: className });

  return <div>
    <h2>Welcome, {username}!</h2>
    <p>Search Classes: </p>
    <input type="text" value={className} onChange={handleClassNameChange}></input>
  </div>
}

export default Profile