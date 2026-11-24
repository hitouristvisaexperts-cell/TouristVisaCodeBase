let _io = null;

const init = (io) => { _io = io; };

const emitToUser = (userId, event, data) => {
  if (_io && userId) {
    _io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

module.exports = { init, emitToUser };
