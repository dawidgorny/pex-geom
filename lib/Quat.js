var Mat4 = require('./Mat4');
var Vec3 = require('./Vec3');
var kEpsilon = Math.pow(2, -24);

function Quat(x, y, z, w) {
  this.x = x != null ? x : 0;
  this.y = y != null ? y : 0;
  this.z = z != null ? z : 0;
  this.w = w != null ? w : 1;
}

Quat.create = function(x, y, z, w) {
  return new Quat(x, y, z, w);
};

Quat.fromArray = function(a) {
  return new Quat(a[0], a[1], a[2], a[3]);
}

Quat.prototype.identity = function() {
  this.set(0, 0, 0, 1);
  return this;
};

Quat.prototype.equals = function(q, tolerance) {
  if (tolerance == null) {
    tolerance = 0.0000001;
  }
  return (Math.abs(q.x - this.x) <= tolerance) && (Math.abs(q.y - this.y) <= tolerance) && (Math.abs(q.z - this.z) <= tolerance) && (Math.abs(q.w - this.w) <= tolerance);
};

Quat.prototype.hash = function() {
  return 1 * this.x + 12 * this.y + 123 * this.z + 1234 * this.w;
};

Quat.prototype.copy = function(q) {
  this.x = q.x;
  this.y = q.y;
  this.z = q.z;
  this.w = q.w;
  return this;
};

Quat.prototype.clone = function() {
  return new Quat(this.x, this.y, this.z, this.w);
};

Quat.prototype.dup = function() {
  return this.clone();
};

Quat.prototype.setAxisAngle = function(v, a) {
  a = a * 0.5;
  var s = Math.sin(a / 180 * Math.PI);
  this.x = s * v.x;
  this.y = s * v.y;
  this.z = s * v.z;
  this.w = Math.cos(a / 180 * Math.PI);
  return this;
};

Quat.prototype.setQuat = function(q) {
  this.x = q.x;
  this.y = q.y;
  this.z = q.z;
  this.w = q.w;
  return this;
};

// http://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToQuaternion/
Quat.prototype.setEuler = function(yaw, pitch, roll) {
  var c1 = Math.cos(yaw/2);
  var s1 = Math.sin(yaw/2);
  var c2 = Math.cos(pitch/2);
  var s2 = Math.sin(pitch/2);
  var c3 = Math.cos(roll/2);
  var s3 = Math.sin(roll/2);
  var c1c2 = c1*c2;
  var s1s2 = s1*s2;
  this.w = c1c2*c3 - s1s2*s3;
  this.x = c1c2*s3 + s1s2*c3;
  this.y = s1*c2*c3 + c1*s2*s3;
  this.z = c1*s2*c3 - s1*c2*s3;
  return this;
};

Quat.prototype.set = function(x, y, z, w) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  return this;
};

Quat.prototype.asMul = function(p, q) {
  var px = p.x;
  var py = p.y;
  var pz = p.z;
  var pw = p.w;
  var qx = q.x;
  var qy = q.y;
  var qz = q.z;
  var qw = q.w;
  this.x = px * qw + pw * qx + py * qz - pz * qy;
  this.y = py * qw + pw * qy + pz * qx - px * qz;
  this.z = pz * qw + pw * qz + px * qy - py * qx;
  this.w = pw * qw - px * qx - py * qy - pz * qz;
  return this;
};

Quat.prototype.mul = function(q) {
  this.asMul(this, q);
  return this;
};

Quat.prototype.mul4 = function(x, y, z, w) {
  var ax = this.x;
  var ay = this.y;
  var az = this.z;
  var aw = this.w;
  this.x = w * ax + x * aw + y * az - z * ay;
  this.y = w * ay + y * aw + z * ax - x * az;
  this.z = w * az + z * aw + x * ay - y * ax;
  this.w = w * aw - x * ax - y * ay - z * az;
  return this;
};

Quat.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
};

Quat.prototype.normalize = function() {
  var len = this.length();
  if (len > kEpsilon) {
    this.x /= len;
    this.y /= len;
    this.z /= len;
    this.w /= len;
  }
  return this;
};

Quat.prototype.toMat4 = function(out) {
  var xs = this.x + this.x;
  var ys = this.y + this.y;
  var zs = this.z + this.z;
  var wx = this.w * xs;
  var wy = this.w * ys;
  var wz = this.w * zs;
  var xx = this.x * xs;
  var xy = this.x * ys;
  var xz = this.x * zs;
  var yy = this.y * ys;
  var yz = this.y * zs;
  var zz = this.z * zs;
  var m = out || new Mat4();
  return m.set4x4r(1 - (yy + zz), xy - wz, xz + wy, 0, xy + wz, 1 - (xx + zz), yz - wx, 0, xz - wy, yz + wx, 1 - (xx + yy), 0, 0, 0, 0, 1);
};

Quat.prototype.setDirection = function(direction, debug) {
  var dir = Vec3.create().copy(direction).normalize();

  var up = Vec3.create(0, 1, 0);

  var right = Vec3.create().asCross(up, dir);

  //if debug then console.log('right', right)

  if (right.length() == 0) {
    up.set(1, 0, 0)
    right.asCross(up, dir);
  }

  up.asCross(dir, right);
  right.normalize();
  up.normalize();

  if (debug) console.log('dir', dir);
  if (debug) console.log('up', up);
  if (debug) console.log('right', right);

  var m = new Mat4();
  m.set4x4r(
    right.x, right.y, right.z, 0,
    up.x, up.y, up.z, 0,
    dir.x, dir.y, dir.z, 0,
    0, 0, 0, 1
  );

  //Step 3. Build a quaternion from the matrix
  var q = new Quat()
  if (1.0 + m.a11 + m.a22 + m.a33 < 0.001) {
    if (debug) console.log('singularity');
    dir = direction.dup();
    dir.z *= -1;
    dir.normalize();
    up.set(0, 1, 0);
    right.asCross(up, dir);
    up.asCross(dir, right);
    right.normalize();
    up.normalize();
    m = new Mat4();
    m.set4x4r(
      right.x, right.y, right.z, 0,
      up.x, up.y, up.z, 0,
      dir.x, dir.y, dir.z, 0,
      0, 0, 0, 1
    );
    q.w = Math.sqrt(1.0 + m.a11 + m.a22 + m.a33) / 2.0;
    var dfWScale = q.w * 4.0;
    q.x = ((m.a23 - m.a32) / dfWScale);
    q.y = ((m.a31 - m.a13) / dfWScale);
    q.z = ((m.a12 - m.a21) / dfWScale);
    if (debug) console.log('dir', dir);
    if (debug) console.log('up', up);
    if (debug) console.log('right', right);

    q2 = new Quat();
    q2.setAxisAngle(new Vec3(0,1,0), 180)
    q2.mul(q);
    return q2;
  }
  q.w = Math.sqrt(1.0 + m.a11 + m.a22 + m.a33) / 2.0;
  dfWScale = q.w * 4.0;
  q.x = ((m.a23 - m.a32) / dfWScale);
  q.y = ((m.a31 - m.a13) / dfWScale);
  q.z = ((m.a12 - m.a21) / dfWScale);

  this.copy(q);
  return this;
}

// http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors
Quat.prototype.setUV = function(u, v) {
  var w = u.dup().cross(v);
  var q = Quat.create(w.x, w.y, w.z, u.dup().dot(v));
  q.w += q.length();
  q.normalize();
  this.x = q.x;
  this.y = q.y;
  this.z = q.z;
  this.w = q.w;
  return this;



  var m = Math.sqrt(2.0 + 2.0 * u.dup().dot(v));
  var w = u.dup().cross(v);

  w.scale( (1.0 / m) );

  this.w = 0.5 * m;
  this.x = w.x;
  this.y = w.y;
  this.z = w.z;

  return this;
}

Quat.prototype.slerp = function(qb, t) {
  var qa = this;

  // Calculate angle between the quaternions
  var cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;

  // If qa=qb or qa=-qb then theta = 0 and we can return qa
  if (Math.abs(cosHalfTheta) >= 1.0){
    return this;
  }

  var halfTheta = Math.acos(cosHalfTheta);
  var sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta*cosHalfTheta);

  // If theta = 180 degrees then result is not fully defined
  // we could rotate around any axis normal to qa or qb
  if (Math.abs(sinHalfTheta) < 0.001){ // fabs is floating point absolute
    this.w = (qa.w * 0.5 + qb.w * 0.5);
    this.x = (qa.x * 0.5 + qb.x * 0.5);
    this.y = (qa.y * 0.5 + qb.y * 0.5);
    this.z = (qa.z * 0.5 + qb.z * 0.5);
    return this;
  }

  var ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
  var ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

  this.w = (qa.w * ratioA + qb.w * ratioB);
  this.x = (qa.x * ratioA + qb.x * ratioB);
  this.y = (qa.y * ratioA + qb.y * ratioB);
  this.z = (qa.z * ratioA + qb.z * ratioB);
  return this;
}

Quat.fromAxisAngle = function(v, a) {
  return new Quat().setAxisAngle(v, a);
}

Quat.fromDirection = function(direction) {
  return new Quat().setDirection(direction);
}

Quat.fromEuler = function(yaw, pitch, roll) {
  return new Quat().setEuler(yaw, pitch, roll);
}

Quat.fromUV = function(u, v) {
  return new Quat().setUV(u, v);
}


module.exports = Quat;
