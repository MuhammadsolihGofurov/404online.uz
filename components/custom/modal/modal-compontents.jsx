import {
  AddStudentsToGroupModal,
  AssignToTeacherModal,
  ChangeGroupMemberModal,
  EditUserModal,
  GenerateCodeModal,
  GroupModal,
  ListGroupMembersModal,
  TeacherModal,
  ViewProfileModal,
} from "./admin-center";
import {
  AssignUserToDocumentsModal,
  DocumentsModal,
  TemplatesModal,
  TemplateUseAsTaskModal,
} from "./materials";
import { UpdateMockModal } from "./mocks";
import {
  ConfirmModal,
  EduCenterCreateAdminModal,
  EduCenterModal,
} from "./owner";
import {
  PassageTextModal,
  QuestionGroupModal,
  SectionViewModal,
  TaskTextModal,
} from "./sections";
import sectionStatusChangeModal from "./sections/section-status-change-modal";
import { TaskEditModal, TaskModal } from "./tasks";
import { GradingWritingModal } from "./tasks-exams";

export const ModalComponents = {
  createEduCenter: EduCenterModal,
  confirmModal: ConfirmModal,
  eduCenterCreateAdmin: EduCenterCreateAdminModal,
  addTeacher: TeacherModal,
  generateCode: GenerateCodeModal,
  editUser: EditUserModal,
  addGroup: GroupModal,
  assignToTeacher: AssignToTeacherModal,
  listGroupMembers: ListGroupMembersModal,
  changeGroupMember: ChangeGroupMemberModal,
  viewProfile: ViewProfileModal,
  updateMock: UpdateMockModal,
  documentsModal: DocumentsModal,
  assignDocumentToUser: AssignUserToDocumentsModal,
  templatesModal: TemplatesModal,
  templateUseAsTask: TemplateUseAsTaskModal,
  taskModal: TaskModal,
  questionGroupModal: QuestionGroupModal,
  passageTextModal: PassageTextModal,
  taskTextModal: TaskTextModal,
  sectionView: SectionViewModal,
  sectionStatusChangeModal: sectionStatusChangeModal,
  taskEditModal: TaskEditModal,
  addStudentsToGroupModal: AddStudentsToGroupModal,
  gradingWritingModal: GradingWritingModal,
};
