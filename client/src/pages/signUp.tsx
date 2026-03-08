import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';

function SignUp() {

    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };
    const handleFNChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
    };
    const handleLNChange = (e: ChangeEvent<HTMLInputElement>) => {
        setLastName(e.target.value);
    };
    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };
    const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAddress(e.target.value);
    };
    const handlePNChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value);
    };
    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    axios.post('http://localhost:8080/SignUp', { username: username, firstName: firstName, lastName: lastName, email: email, address: address, phoneNumber: phoneNumber, password: password });
    return <div>
        <form>
            <p>Username: </p>
            <input type="text" value={username} onChange={handleNameChange}></input>
            <p>First Name: </p>
            <input type="text" value={firstName} onChange={handleFNChange}></input>
            <p>Last Name: </p>
            <input type="text" value={lastName} onChange={handleLNChange}></input>
            <p>Email: </p>
            <input type="email" value={email} onChange={handleEmailChange}></input>
            <p>Address: </p>
            <input type="text" value={address} onChange={handleAddressChange}></input>
            <p>Phone Number: </p>
            <input type="text" value={phoneNumber} onChange={handlePNChange}></input>
            <p>Password: </p>
            <input type="password" value={password} onChange={handlePasswordChange}></input><br></br>
            <input name="submit" type="submit"></input>
        </form>
    </div>
}

export default SignUp