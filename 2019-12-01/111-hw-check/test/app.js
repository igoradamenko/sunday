const should = require('should');
const mongoose = require('mongoose');
const app = require('../app');
const request = require('request-promise').defaults({
  resolveWithFullResponse: true,
  simple: false
});

let server;

const User = require('../models/user');

function getURL(path) {
  return `http://localhost:3000${path}`
}

describe('User REST API', async () => {
  let existingUserData = {
    email: 'john@example.com',
    displayName: 'John'
  };

  let newUserData = {
    email: 'greg@example.com',
    displayName: 'Greg'
  };

  let existingUser;

  before(done => {
    server = app.listen(3000, done);
  });

  after(done => {
    mongoose.disconnect();
    server.close(done);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    existingUser = await User.create(existingUserData);
  });

  describe('GET /users', async () => {
    it('gets all users', async () => {
      const response = await request.get(getURL('/users'));
      response.statusCode.should.eql(200);
      response.headers['content-type'].should.match(/application\/json/);
      JSON.parse(response.body).length.should.eql(1);
    });
  });

  describe('GET /user/:id', async () => {
    it('gets the user by id', async () => {
      const response = await request.get(getURL('/users/' + existingUser._id));
      should.exist(JSON.parse(response.body).email);
      response.statusCode.should.equal(200);
      response.headers['content-type'].should.match(/application\/json/);
    });

    it('returns 404 if user does not exist', async () => {
      const response = await request.get(getURL('/users/55b693486e02c26010ef0000'));
      response.statusCode.should.eql(404);
    });

    it('returns 404 if invalid id', async () => {
      const response = await request.get(getURL('/users/123'));
      response.statusCode.should.eql(404);
    });
  });

  describe('POST /users', async () => {
    it('creates a user', async () => {
      const response = await request({
        method: 'post',
        uri: getURL('/users'),
        json: true,
        body: newUserData
      });

      should.exist(response.body.id);

      const user = await User.findById(response.body.id);
      user.should.be.ok();

      user.displayName.should.equal(newUserData.displayName);
      user.email.should.equal(newUserData.email);
    });

    it('throws if email already exists', async () => {
      const response = await request({
        method: 'post',
        uri: getURL('/users'),
        json: true,
        body: existingUserData
      });

      response.statusCode.should.equal(400);
      should.exist(response.body.errors.email);
    });

    it('throws if email not valid', async () => {
      const response = await request({
        method: 'post',
        uri: getURL('/users'),
        json: true,
        body: {
          email: 'invalid'
        }
      });

      response.statusCode.should.equal(400);
    });
  });

  describe('PATCH /users/id', async () => {
    it('changes a user', async () => {
      const diff = { displayName: 'Some name' };

      const response = await request({
        method: 'patch',
        uri: getURL('/users/' + existingUser._id),
        json: true,
        body: diff
      });

      response.statusCode.should.equal(200);

      const user = await User.findById(existingUser._id);
      user.should.be.ok();

      user.displayName.should.equal(diff.displayName);
    });

    it('throws if email already exists', async () => {
      const prepareResponse = await request({
        method: 'post',
        uri: getURL('/users'),
        json: true,
        body: newUserData
      });

      prepareResponse.statusCode.should.equal(200);

      const response = await request({
        method: 'patch',
        uri: getURL('/users/' + existingUser._id),
        json: true,
        body: { email: newUserData.email }
      });

      response.statusCode.should.equal(400);
      should.exist(response.body.errors.email);
    });

    it('throws if email not valid', async () => {
      const response = await request({
        method: 'patch',
        uri: getURL('/users/' + existingUser._id),
        json: true,
        body: {
          email: 'invalid'
        }
      });

      response.statusCode.should.equal(400);
    });
  });

  describe('DELETE /user/:id', async () => {
    it('removes user', async () => {
      const response = await request.del(getURL('/users/' + existingUser._id));
      response.statusCode.should.eql(200);
      const users = await User.find({});
      users.length.should.eql(0);
    });

    it('returns 404 if the user does not exist', async () => {
      const response = await request.del(getURL('/users/55b693486e02c26010ef0000'));
      response.statusCode.should.eql(404);
    });
  });
});
