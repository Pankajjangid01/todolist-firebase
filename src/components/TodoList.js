import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase"; // Import Firestore db from firebase.js

const TodoList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  // Fetch tasks from Firestore
  const fetchTasks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const fetchedTasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add a new task with default "low" priority
  const addTask = async () => {
    if (newTask.trim()) {
      try {
        await addDoc(collection(db, "tasks"), {
          title: newTask,
          priority: "low",
        });
        fetchTasks(); // Refresh the list after adding a task
        setNewTask("");
      } catch (error) {
        console.error("Error adding task: ", error);
      }
    }
  };

  // Handle drag and drop for task priority
  const handleDragStart = (event, taskId) => {
    event.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (event, newPriority) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("taskId");

    // Update task's priority in Firestore
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { priority: newPriority });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task priority: ", error);
    }
  };

  const allowDrop = (event) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-lg">
        <h2 className="text-2xl font-bold text-indigo-600 text-center mb-6">
          Your To-Do List
        </h2>
        <div className="mb-4 flex justify-between">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="input-field flex-1 p-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add new task"
          />
          <button
            onClick={addTask}
            className="ml-4 bg-indigo-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-indigo-600 transition"
          >
            Add Task
          </button>
        </div>

        <ul className="space-y-4">
          {tasks.map((task) => (
            <li
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              className={`p-4 rounded-lg shadow-md bg-pink-200 text-indigo-800 cursor-grab ${
                task.priority === "high"
                  ? "bg-red-300"
                  : task.priority === "low"
                  ? "bg-green-300"
                  : "bg-yellow-300"
              }`}
            >
              {task.title} (Priority: {task.priority})
            </li>
          ))}
        </ul>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div
            className="p-4 text-center bg-red-100 rounded-lg shadow-md"
            onDrop={(e) => handleDrop(e, "high")}
            onDragOver={allowDrop}
          >
            Drop here for High Priority
          </div>
          <div
            className="p-4 text-center bg-yellow-100 rounded-lg shadow-md"
            onDrop={(e) => handleDrop(e, "medium")}
            onDragOver={allowDrop}
          >
            Drop here for Medium Priority
          </div>
          <div
            className="p-4 text-center bg-green-100 rounded-lg shadow-md"
            onDrop={(e) => handleDrop(e, "low")}
            onDragOver={allowDrop}
          >
            Drop here for Low Priority
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoList;
