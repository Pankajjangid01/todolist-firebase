import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const TodoList = () => {
  const [todoLists, setTodoLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [taskInputs, setTaskInputs] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);

  const auth = getAuth();
  const navigate = useNavigate();

  // Fetch all To-Do Lists and tasks for the logged-in user
  const fetchTodoLists = async (user) => {
    if (user) {
      try {
        const querySnapshot = await getDocs(
          collection(db, `users/${user.uid}/todoLists`)
        );
        const fetchedLists = await Promise.all(
          querySnapshot.docs.map(async (listDoc) => {
            const tasksSnapshot = await getDocs(
              collection(db, `users/${user.uid}/todoLists/${listDoc.id}/tasks`)
            );
            const tasks = tasksSnapshot.docs.map((taskDoc) => ({
              id: taskDoc.id,
              ...taskDoc.data(),
            }));
            return {
              id: listDoc.id,
              ...listDoc.data(),
              tasks,
            };
          })
        );
        setTodoLists(fetchedLists);
      } catch (error) {
        console.error("Error fetching To-Do Lists: ", error);
      }
    }
  };

  // Add a new To-Do List
  const addTodoList = async () => {
    const user = getAuth().currentUser;
    if (newListName.trim() && user) {
      try {
        await addDoc(collection(db, `users/${user.uid}/todoLists`), {
          name: newListName,
        });
        fetchTodoLists(user);
        setNewListName("");
      } catch (error) {
        console.error("Error adding To-Do List: ", error);
      }
    }
  };

  // Handle input change for tasks, specific to each list
  const handleTaskInputChange = (listId, field, value) => {
    setTaskInputs((prev) => ({
      ...prev,
      [listId]: { ...prev[listId], [field]: value },
    }));
  };

  // Add a new task to a specific To-Do List
  const addTask = async (listId) => {
    const user = getAuth().currentUser;
    const newTask = taskInputs[listId];
    if (newTask?.title.trim() && user) {
      try {
        await addDoc(
          collection(db, `users/${user.uid}/todoLists/${listId}/tasks`),
          {
            ...newTask,
          }
        );
        fetchTodoLists(user);
        setTaskInputs((prev) => ({
          ...prev,
          [listId]: {
            title: "",
            description: "",
            dueDate: "",
            priority: "low",
          },
        }));
      } catch (error) {
        console.error("Error adding task: ", error);
      }
    }
  };

  // Handle logout and redirect to login page
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Drag and drop for moving tasks between lists
  const handleDragStart = (task, fromListId) => {
    setDraggedTask({ ...task, fromListId });
  };

  const handleDrop = async (toListId) => {
    const user = getAuth().currentUser;
    if (user && draggedTask) {
      const fromListId = draggedTask.fromListId;

      // If dropped in the same list, just ignore the move
      if (fromListId === toListId) return;

      try {
        // Add to the new list
        const newTaskData = { ...draggedTask };
        delete newTaskData.id; // Firebase doesn't need the task ID
        await addDoc(
          collection(db, `users/${user.uid}/todoLists/${toListId}/tasks`),
          newTaskData
        );

        // Remove from the old list
        const taskRef = doc(
          db,
          `users/${user.uid}/todoLists/${fromListId}/tasks`,
          draggedTask.id
        );
        await deleteDoc(taskRef);

        // Update UI immediately
        setTodoLists((prev) =>
          prev.map((list) =>
            list.id === toListId
              ? { ...list, tasks: [...list.tasks, newTaskData] } // Add to new list
              : list.id === fromListId
              ? {
                  ...list,
                  tasks: list.tasks.filter(
                    (task) => task.id !== draggedTask.id
                  ),
                } // Remove from old list
              : list
          )
        );

        setDraggedTask(null);
      } catch (error) {
        console.error("Error moving task: ", error);
      }
    }
  };

  // Drag and drop for reordering tasks within the same list
  const handleDropWithinSameList = (listId, taskId, dropPositionTaskId) => {
    setTodoLists((prevLists) => {
      return prevLists.map((list) => {
        if (list.id !== listId) return list;

        const draggedTaskIndex = list.tasks.findIndex(
          (task) => task.id === taskId
        );
        const dropPositionTaskIndex = list.tasks.findIndex(
          (task) => task.id === dropPositionTaskId
        );

        const updatedTasks = [...list.tasks];
        const [removedTask] = updatedTasks.splice(draggedTaskIndex, 1);
        updatedTasks.splice(dropPositionTaskIndex, 0, removedTask);

        return { ...list, tasks: updatedTasks };
      });
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTodoLists(user);
      } else {
        setTodoLists([]);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-600">To-Do App</h2>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <div className="mb-4 flex justify-between">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="input-field flex-1 p-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Create new To-Do List"
          />
          <button
            onClick={addTodoList}
            className="ml-4 bg-indigo-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-indigo-600 transition"
          >
            Add List
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {todoLists.map((list) => (
            <div
              key={list.id}
              className="p-4 bg-gray-100 rounded-lg shadow-md"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(list.id)}
            >
              <h3 className="text-xl font-bold text-indigo-700 mb-4">
                {list.name}
              </h3>

              <div className="mb-4">
                <input
                  type="text"
                  value={taskInputs[list.id]?.title || ""}
                  onChange={(e) =>
                    handleTaskInputChange(list.id, "title", e.target.value)
                  }
                  className="p-2 border rounded-md mb-2"
                  placeholder="Task Title"
                />
                <input
                  type="text"
                  value={taskInputs[list.id]?.description || ""}
                  onChange={(e) =>
                    handleTaskInputChange(
                      list.id,
                      "description",
                      e.target.value
                    )
                  }
                  className="p-2 border rounded-md mb-2"
                  placeholder="Task Description"
                />
                <input
                  type="date"
                  value={taskInputs[list.id]?.dueDate || ""}
                  onChange={(e) =>
                    handleTaskInputChange(list.id, "dueDate", e.target.value)
                  }
                  className="p-2 border rounded-md mb-2"
                />
                <select
                  value={taskInputs[list.id]?.priority || "low"}
                  onChange={(e) =>
                    handleTaskInputChange(list.id, "priority", e.target.value)
                  }
                  className="p-2 border rounded-md mb-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  onClick={() => addTask(list.id)}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-indigo-600 transition"
                >
                  Add Task
                </button>
              </div>

              <ul className="space-y-4">
                {list.tasks.map((task) => (
                  <li
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task, list.id)}
                    onDrop={() => handleDropWithinSameList(list.id, task.id)}
                    className={`p-4 rounded-lg shadow-md ${
                      task.priority === "high"
                        ? "bg-red-300"
                        : task.priority === "medium"
                        ? "bg-yellow-300"
                        : "bg-green-300"
                    }`}
                  >
                    {task.title} (Priority: {task.priority}) - {task.dueDate}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodoList;
