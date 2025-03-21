import { ProjectModel } from "@schema/project/ProjectSchema";
import { TeamMemberModel, TeamMemberRole, TPermission, TTeamMember } from "@schema/TeamMemberSchema";
import { UserModel } from "@schema/UserSchema";

export type MemberWithPermissions = {
    id: string | null,
    email: string,
    name: string,
    role: TeamMemberRole,
    pending: boolean,
    me: boolean,
    permission: TPermission
}

export default defineEventHandler(async event => {

    const data = await getRequestData(event, [], ['OWNER']);
    if (!data) return;

    const { project_id, project, user } = data;

    const owner = await UserModel.findById(project.owner);
    if (!owner) return setResponseStatus(event, 400, 'No owner');

    const members = await TeamMemberModel.find({ project_id });

    const result: MemberWithPermissions[] = [];

    result.push({
        id: null,
        email: owner.email,
        name: owner.name,
        role: 'OWNER',
        pending: false,
        me: user.id === owner.id,
        permission: {
            webAnalytics: true,
            events: true,
            ai: true,
            domains: ['All domains']
        }
    })

    for (const member of members) {
        const userMember = member.user_id ? await UserModel.findById(member.user_id) : await UserModel.findOne({ email: member.email });
        if (!userMember) continue;

        const permission: TPermission = {
            webAnalytics: member.permission?.webAnalytics || false,
            events: member.permission?.events || false,
            ai: member.permission?.ai || false,
            domains: member.permission?.domains || []
        }

        result.push({
            id: member.id,
            email: userMember.email,
            name: userMember.name,
            role: member.role,
            pending: member.pending,
            me: user.id === userMember.id,
            permission
        })
    }

    return result;

});