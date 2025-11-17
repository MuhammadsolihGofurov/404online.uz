import {
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
  ConfirmModal,
  EduCenterCreateAdminModal,
  EduCenterModal,
} from "./owner";

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
};
