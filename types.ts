
export interface Section {
  title: string;
  details: string[]; // Each string is a paragraph or a list item
}

export interface HealthTopicInfo {
  topicName: string;
  introduction: string; // A general overview of the topic
  sections: Section[];
}
