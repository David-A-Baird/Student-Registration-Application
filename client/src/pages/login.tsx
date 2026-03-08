import React, { useState } from 'react';
import type { ChangeEvent } from 'react';

function LogIn() {
    const [selectedValue, setSelectedValue] = useState<string>('option1');

  const handleSelectionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
  }
    return <div>
                <input type="text" name="username" placeholder="username"></input><br></br>
                <input type="password" name="password" placeholder="password"></input><br></br>
                <select id="options" value={selectedValue} onChange={handleSelectionChange}>
                    <option value="student">Student</option>
                    <option value="administrator">Administrator</option>
                </select>
                <input type="submit" name="submit"></input>
        </div>
}

export default LogIn