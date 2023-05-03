import React, { useEffect, useState, KeyboardEvent, useRef } from "react";
import Calendar from 'react-calendar';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, setDoc, deleteDoc, doc } from "firebase/firestore";
import { auth} from "../lib/firebase";
import { Map } from "./map";


export interface Item {
    id: string;
    userID: string;
    title: string;
    startTime: string;
    endTime: string;
    day: number;
    month: number;
    year: number;
    location: string;
    description?: string;
    note?: string;
    editing?: boolean;
}

export const UserCalendar = () =>{
    const [userID, setUserID] = useState("");
    const [value, onChange] = useState(new Date());
    const [dayView, setDayView] = useState(false);
    const [dayViewWeekday, setDayViewWeekday] = useState(0);
    const [dayViewDay, setDayViewDay] = useState(0);
    const [dayViewMonth, setDayViewMonth] = useState(0);
    const [dayViewYear, setDayViewYear] = useState(0);
    const [items, setItems] = useState<Item[]>();
    const [dayViewItems, setDayViewItems] = useState<Item[]>();
    const [creatingItem, setCreatingItem] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState("");
    const [newItemStartTime, setNewItemStartTime] = useState("10:30");
    const [newItemEndTime, setNewItemEndTime] = useState("11:30");
    const [newItemLocation, setNewItemLocation] = useState("");
    const [newItemDescription, setNewItemDescription] = useState("");
    const [newItemNote, setNewItemNote] = useState("");
    const [changeCount, setChangeCount] = useState(0);
    const [editItemTitle, setEditItemTitle] = useState("")
    const [editItemStartTime, setEditItemStartTime] = useState("");
    const [editItemEndTime, setEditItemEndTime] = useState("");
    const [editItemLocation, setEditItemLocation] = useState("");
    const [editItemDescription, setEditItemDescription] = useState("");
    const [editItemNote, setEditItemNote] = useState("");


    useEffect(() => {
        if (auth.currentUser !== null) {
            setUserID(auth.currentUser.uid);
            getItems(auth.currentUser.uid);
        }
    }, [changeCount]);

    useEffect(() => {
        if (dayView && items !== undefined) {
            let newDayViewItems = [];
            for (let i in items) {
                if (items[i].day === dayViewDay && items[i].month === dayViewMonth && items[i].year === dayViewYear) {
                    items[i].editing = false;
                    newDayViewItems.push(items[i]);
                }
            }
            newDayViewItems = orderItemsByTime(newDayViewItems);
            setDayViewItems(newDayViewItems);
        }
    }, [dayView, items]);

    useEffect(() => {

    }, [dayViewItems]);

    useEffect(() => {
        if (newItemStartTime !== "" && newItemEndTime !== "") {
            const newStartTimeArray = newItemStartTime.split(":");
            const newEndTimeArray = newItemEndTime.split(":");
            if (newStartTimeArray[0] > newEndTimeArray[0]) {
                setNewItemEndTime(((parseInt(newStartTimeArray[0]) + 1)+ ":" + newStartTimeArray[1]));
            }
        }
    }, [newItemStartTime])

    const tileContent = ({ date, view}: any) => {
        if (view === "month") {
            let itemTitles = [];
            const today = new Date();
            if (today.getDate() === date.getDate() && today.getMonth() === date.getMonth()) {
                itemTitles.push("Today!")
            }
            if (items !== undefined) {
                for (let i = 0; i < items.length; i++){
                    if (items[i].day === date.getDate() && items[i].month === date.getMonth() && items[i].year === date.getFullYear()) {
                        itemTitles.push(items[i].title)
                    }
                }
            }
            let listItems: any = <div></div>;
            if (itemTitles.length !== 0) {
                listItems = itemTitles.map((item) => {
                    return <li key={item}>{item}</li>;
                });
            }
            return listItems;
        }
        return null;
    }

    function orderItemsByTime(newDayViewItems: Item[]) {
        if (newDayViewItems.length > 0) {
            let orderedItems = [...newDayViewItems];
            orderedItems.sort((a, b) => {
                const [aHour, aMin] = a.startTime.split(":").map(Number);
                const [bHour, bMin] = b.startTime.split(":").map(Number);
          
                if (aHour < bHour) {
                    return -1;
                } else if (aHour > bHour) {
                    return 1;
                } else {
                    if (aMin < bMin) {
                        return -1;
                    } else if (aMin > bMin) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            });
            return orderedItems;
        }
        return [];
    }

    function clickDay(day: Date) {
        if (day !== null && !dayView) {
            setDayView(true);
            setDayViewWeekday(day.getDay());
            setDayViewDay(day.getDate());
            setDayViewMonth(day.getMonth());
            setDayViewYear(day.getFullYear());
        }
    }

    function leaveDayView() {
        setDayView(false);
        setDayViewWeekday(0);
        setDayViewDay(0);
        setDayViewMonth(0);
        setDayViewYear(0);
        setCreatingItem(false);
    }

    async function getItems(user: string) {
        let gettingItems: Item[] = [];
        const querySnapshot = await getDocs(collection(db, `${user}`));
        querySnapshot.forEach((doc) => {
        //console.log(`${doc.id} => ${doc.data()}`);
        gettingItems.push(doc.data() as Item);
        gettingItems[gettingItems.length-1].id = doc.id;
        });
        setItems(gettingItems);
    }

    async function createNewItem() {
        if (newItemTitle !== "") {
            try {
                const docRef = await addDoc(collection(db, `${userID}`), {
                    userId: userID,
                    title: newItemTitle,
                    startTime: newItemStartTime,
                    endTime: newItemEndTime,
                    day: dayViewDay,
                    month: dayViewMonth,
                    year: dayViewYear,
                    location: newItemLocation,
                    description: newItemDescription,
                    note: newItemNote,
                });
                //console.log("Document written with ID: ", docRef.id);
                setChangeCount(changeCount => changeCount + 1);
            } catch (e) {
                console.error("Error adding document: ", e);
          }
          setCreatingItem(false);
          setNewItemTitle("");
          setNewItemLocation("");
          setNewItemDescription("");
        }
    }

    async function deleteEvent(item: Item) {
        await deleteDoc(doc(db, `${userID}`, `${item.id}`))
        .then(() => {
            location.reload();
        })
        .catch(error => {
            console.log(error);
        })
    }

    async function editItem(item: Item) {
        const itemRef = doc(db, `${userID}`, `${item.id}`);
        setDoc(itemRef, {
            title: editItemTitle,
            startTime: editItemStartTime,
            endTime: editItemEndTime,
            location: editItemLocation,
            description: editItemDescription,
            note: editItemNote,
        }, {merge: true})
        .then(() => {
            item.editing = false;
            setEditItemTitle("");
            setEditItemStartTime("");
            setEditItemEndTime("");
            setEditItemDescription("");
            setEditItemNote("");
            setEditItemLocation("");
            location.reload();
        })
        .catch(error => {
            console.log(error);
        })
    }

    function setEditingItem(item: Item) {
        let alreadyEditing = false;
        if (dayViewItems) {
            for (let i of dayViewItems) {
                if (i.editing === true) {
                    alreadyEditing = true;
                }
            }
        }
        if (!alreadyEditing) {
            item.editing = true;
            setEditItemTitle(item.title);
            setEditItemStartTime(item.startTime);
            setEditItemEndTime(item.endTime);
            if (item.description) {
                setEditItemDescription(item.description);
            }
            if (item.note) {
                setEditItemNote(item.note);
            }
            if (item.location) {
                setEditItemLocation(item.location);
            }
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
          createNewItem();
        }
    }

    function dayOfWeek(day: number) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        if (day >= 0 && day < 7) {
            return days[day];
        }
    }

    function getMonth(month: number) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (month >= 0 && month < 12) {
            return months[month];
        }
    }

    function getProperTime(time: string) {
        if (time !== "") {
            let properTimeArray = time.split(":");
            if (parseInt(properTimeArray[0]) > 12) {
                return (parseInt(properTimeArray[0]) - 12) + ":" + properTimeArray[1] + " PM";
            } else if (parseInt(properTimeArray[0]) === 12) {
                return time + " PM"
            } else {
                return time + " AM"
            }
        }
    }

    let inputErrorMessage = null;
    if (newItemTitle === "") {
        inputErrorMessage = <p>Must include a valid title and time.</p>
    }
    let itemCreationForm = <div>
        <button onClick={() => setCreatingItem(true)}>New Event</button>
    </div>;
    if (creatingItem) {
        itemCreationForm = <div>
            <p>Title: <input type="text" value={newItemTitle} onChange={e=> setNewItemTitle(e.target.value)} onKeyDown={e => handleKeyDown(e)}></input></p>
            <p>Start Time: <input type="time" value={newItemStartTime} onChange={e=> setNewItemStartTime(e.target.value)}></input></p>
            <p>End Time: <input type="time" value={newItemEndTime} onChange={e=> setNewItemEndTime(e.target.value)}></input></p>
            <p>Description: <input type="text" value={newItemDescription} onChange={e=> setNewItemDescription(e.target.value)} onKeyDown={e => handleKeyDown(e)}></input></p>
            <p>Notes: <input type="text" value={newItemNote} onChange={e=> setNewItemNote(e.target.value)} onKeyDown={e => handleKeyDown(e)}></input></p>
            <p>Location: <input type="text" value={newItemLocation} onChange={e=> setNewItemLocation(e.target.value)} onKeyDown={e => handleKeyDown(e)}></input></p>
            { inputErrorMessage }
            <button onClick={() => createNewItem()}>Save</button>
        </div>
    }

    let calendarOutput = <div></div>
    if (dayView) {
        calendarOutput = 
        <div><br></br>
            <button onClick={leaveDayView}>Month View</button><br></br><br></br>
            <h3>{dayOfWeek(dayViewWeekday)} {getMonth(dayViewMonth)} {dayViewDay}</h3><br></br>
            {itemCreationForm}
            {
            dayViewItems?.map((item) => (
                <div key={item.id} className="individual-event">
                    {item.editing 
                    ? <div>
                        <p>Title: <input type="text" value={editItemTitle} onChange={e=> setEditItemTitle(e.target.value)}></input></p>
                        <p>Start Time: <input type="time" value={editItemStartTime} onChange={e=> setEditItemStartTime(e.target.value)}></input></p>
                        <p>End Time: <input type="time" value={editItemEndTime} onChange={e=> setEditItemEndTime(e.target.value)}></input></p>
                        <p>Description: <input type="text" value={editItemDescription} onChange={e=> setEditItemDescription(e.target.value)}></input></p>
                        <p>Notes: <input type="text" value={editItemNote} onChange={e=> setEditItemNote(e.target.value)}></input></p>
                        <p>Location: <input type="text" value={editItemLocation} onChange={e=> setEditItemLocation(e.target.value)}></input></p>
                        <button onClick={() => editItem(item)}>Save</button>
                    </div>
                    : <div>
                    <div className="event-edit"><button onClick={() => setEditingItem(item)}>Edit</button><button onClick={() => deleteEvent(item)}>Delete</button></div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <p>Begin: {getProperTime(item.startTime)}</p>
                    <p>End: {getProperTime(item.endTime)}</p>
                    {item.location !== "" && (
                        <Map item={item}/>
                    )}</div>}
                </div>
            ))
            }
        </div>;
    } else {
        // @ts-ignore
        calendarOutput = <Calendar onChange={onChange} value={value} tileContent={tileContent} onClickDay={(day, e) => clickDay(day)}/>
    }

  return (
    <div className="calendar">
        {calendarOutput}
    </div>
  );
}
