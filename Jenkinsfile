pipeline {
  agent {
    kubernetes {
      cloud 'minikube-cloud'
      defaultContainer 'jnlp'
      yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: jnlp
    image: jenkins/inbound-agent:latest
    tty: true
  - name: dind
    image: docker:24.0.7-dind
    securityContext:
      privileged: true
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""                     # disable TLS so docker client can connect without certs
    volumeMounts:
      - name: docker-sock
        mountPath: /var/run/docker.sock
  - name: docker
    image: docker:24.0.7
    command:
    - cat
    tty: true
    env:
      - name: DOCKER_HOST
        value: "unix:///var/run/docker.sock"
  - name: git
    image: alpine/git:latest
    command:
    - cat
    tty: true
  volumes:
  - name: dind-storage
    emptyDir: {}
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
"""
    }
  }

  environment {
    DOCKER_IMAGE = "mariem631/evershop"
    IMAGE_TAG = "build-${BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        // Checkout using Jenkins' Git plugin (credentialsId must match what you created)
        git branch: 'main',
            credentialsId: 'github-creds',
            url: 'https://github.com/MariemSaiidii/evershop-dev.git'
      }
    }

    stage('Build & Push Docker image') {
      steps {
        container('docker') {
          // inject DockerHub username + password from Jenkins credentials
          withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
            sh '''
# wait for the dind daemon to be ready (tries up to ~30s)
for i in $(seq 1 30); do
  docker info >/dev/null 2>&1 && break || sleep 1
done

echo "Logging into DockerHub..."
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

echo "Building image..."
docker build -t $DOCKER_IMAGE:$IMAGE_TAG ./evershop

echo "Pushing image..."
docker push $DOCKER_IMAGE:$IMAGE_TAG

# also update 'latest' tag (optional)
docker tag $DOCKER_IMAGE:$IMAGE_TAG $DOCKER_IMAGE:latest
docker push $DOCKER_IMAGE:latest
'''
          }
        }
      }
    }

    stage('Update Helm values.yaml and push to Git') {
      steps {
        // Use the git container for safe git commands (alpine/git has git)
        container('git') {
          withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
            sh '''
set -e

git config user.email "ci@jenkins"
git config user.name "Jenkins CI"

# Update Helm values.yaml image repository & tag
# (this uses simple sed replacements that match your values.yaml structure)
sed -i 's|repository: .*|repository: '"$DOCKER_IMAGE"'|' helm/values.yaml
sed -i 's|tag: .*|tag: '"$IMAGE_TAG"'|' helm/values.yaml

git add helm/values.yaml
git commit -m "ci: update image to $DOCKER_IMAGE:$IMAGE_TAG" || echo "No changes to commit"

# push using embedded credentials (HTTPS)
git remote set-url origin https://$GIT_USER:$GIT_PASS@github.com/MariemSaiidii/evershop-dev.git
git push origin main
'''
          }
        }
      }
    }
  } // stages
}
