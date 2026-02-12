
import 'mocha';
import * as admin from 'firebase-admin';
import * as sinon from 'sinon';
import { assert } from 'chai';
import test from 'firebase-functions-test';

// Initialize firebase-functions-test
const t = test();

describe('Cloud Functions Integration Tests', () => {
    let myFunctions: any;
    let adminFunctions: any;
    // let adminInitStub: sinon.SinonStub;
    // let firestoreStub: sinon.SinonStub;
    // let authStub: sinon.SinonStub;

    // Mocks
    const firestoreMock = {
        collection: sinon.stub(),
        batch: sinon.stub(),
    };
    const authMock = {
        getUser: sinon.stub(),
        setCustomUserClaims: sinon.stub(),
        updateUser: sinon.stub(),
        revokeRefreshTokens: sinon.stub(),
    };

    before(() => {
        // 1. Stub admin.initializeApp
        // More robust check for admin.apps
        if (!admin.apps || admin.apps.length === 0) {
            sinon.stub(admin, 'initializeApp');
        }

        // 2. Mock Admin Auth
        // @ts-ignore
        sinon.stub(admin, 'auth').get(() => () => authMock);

        // 3. Mock Admin Firestore
        // We need to handle FieldValue.serverTimestamp
        const firestoreFnStub = sinon.stub();
        firestoreFnStub.returns(firestoreMock);
        // @ts-ignore
        firestoreFnStub.FieldValue = {
            serverTimestamp: () => 'MOCK_TIMESTAMP'
        };

        // @ts-ignore
        sinon.stub(admin, 'firestore').get(() => firestoreFnStub);


        // 4. Require functions AFTER mocking
        myFunctions = require('../users');
        adminFunctions = require('../admin');
    });

    after(() => {
        t.cleanup();
        sinon.restore();
    });

    describe('registerStudent', () => {
        it('should register a student successfully', async () => {
            // Setup Mocks
            const userRecord = { customClaims: {} };
            authMock.getUser.resolves(userRecord);
            authMock.setCustomUserClaims.resolves();

            const batchMock = {
                set: sinon.stub(),
                commit: sinon.stub().resolves(),
            };
            firestoreMock.batch.returns(batchMock);

            const docMock = { id: 'test-uid' };
            const collectionMock = { doc: sinon.stub().returns(docMock) };
            firestoreMock.collection.returns(collectionMock);

            // Execute
            const wrapped = t.wrap(myFunctions.registerStudent);
            const data = {
                displayName: 'Test Student',
                year: 2025,
                skills: ['Typescript'],
                tenantId: 'test-tenant'
            };
            const context = {
                auth: { uid: 'test-uid', token: { email: 'test@example.com' } }
            };

            const result = await wrapped(data, context);

            // Assert
            assert.deepEqual(result, { success: true, message: "Student registered successfully." });
            assert.isTrue(authMock.setCustomUserClaims.calledWith('test-uid', { role: 'student', status: 'active' }));
        });
    });

    describe('registerAlumni', () => {
        it('should register an alumni successfully', async () => {
            // Setup Mocks
            const userRecord = { customClaims: {}, email: 'alumni@test.com' };
            authMock.getUser.resolves(userRecord);
            authMock.setCustomUserClaims.resolves();

            const batchMock = {
                set: sinon.stub(),
                commit: sinon.stub().resolves(),
            };
            firestoreMock.batch.returns(batchMock);

            const docMock = { id: 'test-uid' };
            const collectionMock = { doc: sinon.stub().returns(docMock) };
            firestoreMock.collection.returns(collectionMock);

            // Execute
            const wrapped = t.wrap(myFunctions.registerAlumni);
            const data = {
                displayName: 'Test Alumni',
                company: 'Tech Corp',
                role: 'Engineer',
                mentorOptIn: true,
                referralOptIn: false,
                tenantId: 'test-tenant'
            };
            const context = {
                auth: { uid: 'test-uid', token: { email: 'alumni@test.com' } }
            };

            const result = await wrapped(data, context);

            // Assert
            assert.deepEqual(result, { success: true, message: "Alumni application submitted." });
            assert.isTrue(authMock.setCustomUserClaims.calledWith('test-uid', { role: 'alumni', status: 'pending' }));
        });
    });

    describe('approveAlumni', () => {
        it('should approve an alumni successfully', async () => {
            const targetUid = 'target-alumni-uid';

            // Setup Mocks
            const docMock = {
                get: sinon.stub().resolves({
                    exists: true,
                    data: () => ({ role: 'alumni' })
                }),
                update: sinon.stub().resolves()
            };
            const collectionMock = {
                doc: sinon.stub().withArgs(targetUid).returns(docMock),
                // Handle audit log collection
                add: sinon.stub().resolves()
            };
            // Need to handle different collections
            firestoreMock.collection.callsFake((path: string) => {
                if (path === 'adminAuditLogs') {
                    return { add: sinon.stub().resolves() };
                }
                return collectionMock;
            });

            authMock.setCustomUserClaims.resolves();

            // Execute
            const wrapped = t.wrap(adminFunctions.approveAlumni);
            const data = {
                uid: targetUid,
                tenantId: 'test-tenant'
            };
            const context = {
                auth: { uid: 'admin-uid', token: { role: 'admin' } }
            };

            const result = await wrapped(data, context);

            // Assert
            assert.deepEqual(result, { success: true });
            assert.isTrue(authMock.setCustomUserClaims.calledWith(targetUid, { role: 'alumni', status: 'active' }));
        });
    });


    describe('suspendUser', () => {
        it('should suspend a user successfully', async () => {
            const targetUid = 'target-user-uid';
            const reason = 'Violation of terms';

            // Setup Mocks
            const docMock = {
                update: sinon.stub().resolves()
            };
            firestoreMock.collection.callsFake((path: string) => {
                if (path === 'adminAuditLogs') {
                    return { add: sinon.stub().resolves() };
                }
                return { doc: sinon.stub().returns(docMock) };
            });

            authMock.updateUser.resolves();
            authMock.revokeRefreshTokens.resolves();

            // Execute
            const wrapped = t.wrap(adminFunctions.suspendUser);
            const data = {
                uid: targetUid,
                reason: reason
            };
            const context = {
                auth: { uid: 'admin-uid', token: { role: 'admin' } }
            };

            const result = await wrapped(data, context);

            // Assert
            assert.deepEqual(result, { success: true, message: "User suspended." });
            assert.isTrue(authMock.updateUser.calledWith(targetUid, { disabled: true }));
        });
    });

    // Phase 3 Tests

    describe('createPost', () => {
        it('should create a post successfully', async () => {
            const postsFunctions = require('../posts');
            const uid = 'user-uid';

            // Setup Mocks
            // const docMock = { id: 'new-post-id' };
            const refMock = {
                set: sinon.stub().resolves(),
                id: 'new-post-id'
            };

            // Mock Rate Limiter calls: db.collection("users").doc(uid).collection("rateLimits").doc(actionType)
            const rateLimitDocMock = {
                get: sinon.stub().resolves({ exists: false }),
                set: sinon.stub().resolves()
            };
            const rateLimitCollectionMock = {
                doc: sinon.stub().withArgs('create_post').returns(rateLimitDocMock)
            };
            const userDocMock = {
                collection: sinon.stub().withArgs('rateLimits').returns(rateLimitCollectionMock)
            };
            const usersCollectionMock = {
                doc: sinon.stub().withArgs(uid).returns(userDocMock)
            };

            const postsCollectionMock = {
                doc: sinon.stub().returns(refMock)
            };

            firestoreMock.collection.withArgs('posts').returns(postsCollectionMock);
            firestoreMock.collection.withArgs('users').returns(usersCollectionMock);

            // Execute
            const wrapped = t.wrap(postsFunctions.createPost);
            const data = {
                title: 'My First Post',
                content: 'This is the content of my first post.',
                tags: ['intro', 'general'],
                tenantId: 'default-tenant'
            };
            const context = { auth: { uid } };

            const result = await wrapped(data, context);

            // Assert
            assert.deepEqual(result, { success: true, postId: 'new-post-id' });
            assert.isTrue(refMock.set.called);
        });
    });

    describe('requestGuidance', () => {
        it('should create a guidance request successfully', async () => {
            const guidanceFunctions = require('../guidance');
            const studentId = 'student-uid';

            // Setup Mocks
            const refMock = {
                set: sinon.stub().resolves(),
                id: 'request-id'
            };

            // Mock Rate Limiter calls: db.collection("users").doc(uid).collection("rateLimits").doc(actionType)
            const rateLimitDocMock = {
                get: sinon.stub().resolves({ exists: false }),
                set: sinon.stub().resolves()
            };
            const rateLimitCollectionMock = {
                doc: sinon.stub().withArgs('request_guidance').returns(rateLimitDocMock)
            };
            const userDocMock = {
                collection: sinon.stub().withArgs('rateLimits').returns(rateLimitCollectionMock)
            };
            const usersCollectionMock = {
                doc: sinon.stub().withArgs(studentId).returns(userDocMock)
            };

            const guidanceCollectionMock = {
                doc: sinon.stub().returns(refMock)
            };

            firestoreMock.collection.withArgs('guidanceRequests').returns(guidanceCollectionMock);
            firestoreMock.collection.withArgs('users').returns(usersCollectionMock);

            // Execute
            const wrapped = t.wrap(guidanceFunctions.requestGuidance);
            const data = {
                mentorId: 'mentor-uid',
                topic: 'Career Advice',
                message: 'I need help with my career path.',
                tenantId: 'default-tenant'
            };
            const context = {
                auth: { uid: studentId, token: { role: 'student' } }
            };

            const result = await wrapped(data, context);

            // Assert
            assert.deepEqual(result, { success: true, requestId: 'request-id' });
            assert.isTrue(refMock.set.called);
        });
    });


});
