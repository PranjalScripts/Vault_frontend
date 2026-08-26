import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.1.62:6307/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getSubjects = () => {
  return API.get("/subjects/getAll-subjects");
};

export const getSubject = (id) => {
  return API.get(`/subjects/${id}`);
};

export const createSubject = (subjectName) => {
  return API.post("/subjects/create-subject", {
    subjectName,
  });
};

export const addTopic = (subjectId, topicData) => {
  return API.post(`/subjects/${subjectId}/topics`, topicData);
};

export const deleteSubject = (subjectId) => {
  return API.delete(`/subjects/${subjectId}`);
};

export const updateTopic = (subjectId, topicId, topicData) => {
  return API.put(`/subjects/${subjectId}/topics/${topicId}`, topicData);
};

export const deleteTopic = (subjectId, topicId) => {
  return API.delete(`/subjects/${subjectId}/topics/${topicId}`);
};

export default API;
